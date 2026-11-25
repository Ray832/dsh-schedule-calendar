/**
 * Author-side schema DSL → raw JSON Schema.
 *
 * DSH's tool registry accepts only its enforced JSON Schema subset, and the
 * `defineTool` helper that performs this conversion lives in
 * `@deepseek-ai/dsh-tools` — a package this plugin cannot import, because it is
 * resolved from the DSH installation rather than from the plugin directory.
 * Shipping the compiler keeps the host half dependency-free while producing
 * exactly the schema the registry accepts, so registering a tool cannot fail
 * silently for a shape reason again.
 */

/** One author-side schema node, mirroring the DSH tool DSL. */
export interface AuthorSchema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'null' | 'array' | 'object' | 'json'
  /** Marks a property as required inside its parent object; `true` only. */
  required?: boolean
  description?: string
  items?: AuthorSchema
  properties?: Record<string, AuthorSchema>
  additionalProperties?: boolean
  enum?: unknown[]
  const?: unknown
  oneOf?: AuthorSchema[]
}

/** Raw JSON Schema node, in the subset the tool registry accepts. */
export type JsonSchema = Record<string, unknown>

/** Keys the raw subset allows besides `type`/`oneOf`/keywords. */
const ANNOTATIONS = ['description', 'title', 'default', 'examples'] as const

/** Reject an author mistake with the path that caused it. */
function fail(path: string, message: string): never {
  throw new Error(`tool schema ${path}: ${message}`)
}

/**
 * Compile one value node.
 * @param spec - author schema.
 * @param path - diagnostic path.
 * @param allowRequired - whether `required: true` is legal at this position.
 * @returns the raw schema node.
 */
function compileValue(spec: AuthorSchema, path: string, allowRequired: boolean): JsonSchema {
  if (spec === null || typeof spec !== 'object') fail(path, 'must be a schema object')
  const node: JsonSchema = {}
  const allowed = new Set<string>([...ANNOTATIONS, 'type', 'oneOf'])
  if (allowRequired) allowed.add('required')

  for (const key of Object.keys(spec)) {
    if (key === 'items' || key === 'properties' || key === 'additionalProperties' || key === 'enum' || key === 'const') continue
    if (!allowed.has(key)) fail(`${path}.${key}`, 'is not part of the tool schema DSL')
  }
  if (spec.required !== undefined && spec.required !== true) fail(`${path}.required`, 'must be true when present')

  for (const key of ANNOTATIONS) {
    const value = (spec as Record<string, unknown>)[key]
    if (value !== undefined) node[key] = value
  }

  if (spec.oneOf !== undefined) {
    if (spec.type !== undefined) fail(path, 'cannot declare both type and oneOf')
    if (!Array.isArray(spec.oneOf) || spec.oneOf.length < 2) fail(`${path}.oneOf`, 'must list at least two schemas')
    node.oneOf = spec.oneOf.map((branch, index) => compileValue(branch, `${path}.oneOf[${index}]`, false))
    return node
  }

  switch (spec.type) {
    case 'object': {
      if (typeof spec.additionalProperties !== 'boolean') {
        fail(`${path}.additionalProperties`, 'must be true or false')
      }
      node.type = 'object'
      node.additionalProperties = spec.additionalProperties
      if (spec.properties !== undefined) {
        const compiled = compileProperties(spec.properties, `${path}.properties`)
        node.properties = compiled.properties
        if (compiled.required.length > 0) node.required = compiled.required
      }
      return node
    }
    case 'array': {
      node.type = 'array'
      if (spec.items !== undefined) node.items = compileValue(spec.items, `${path}.items`, false)
      return node
    }
    case 'string':
    case 'number':
    case 'integer':
    case 'boolean':
    case 'null': {
      node.type = spec.type
      if (spec.enum !== undefined) {
        if (!Array.isArray(spec.enum) || spec.enum.length === 0) fail(`${path}.enum`, 'must be a non-empty array')
        node.enum = [...spec.enum]
      }
      if (spec.const !== undefined) node.const = spec.const
      return node
    }
    case 'json':
      // Author-only node: the registry accepts an annotation-only schema.
      return node
    default:
      return fail(`${path}.type`, 'must be string/number/integer/boolean/null/array/object/json, or use oneOf')
  }
}

/**
 * Compile a property map, collecting required names.
 * @param properties - author properties.
 * @param path - diagnostic path.
 * @returns compiled properties and the required list.
 */
function compileProperties(properties: Record<string, AuthorSchema>, path: string): { properties: Record<string, JsonSchema>; required: string[] } {
  const out: Record<string, JsonSchema> = {}
  const required: string[] = []
  for (const [key, spec] of Object.entries(properties)) {
    if (spec === null || typeof spec !== 'object') fail(`${path}.${key}`, 'must be a schema object')
    out[key] = compileValue(spec, `${path}.${key}`, true)
    if (spec.required === true) required.push(key)
  }
  return { properties: out, required }
}

/**
 * Compile the implicit parameter object.
 * @param parameters - author parameter map.
 * @returns an object-rooted raw schema.
 */
export function parametersToSchema(parameters: Record<string, AuthorSchema>): JsonSchema {
  const { properties, required } = compileProperties(parameters, 'parameters')
  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
  }
}

/**
 * Compile a tool's output schema.
 * @param schema - author schema, object-rooted.
 * @returns the raw schema node.
 */
export function outputToSchema(schema: AuthorSchema): JsonSchema {
  return compileValue(schema, 'schema', false)
}

/**
 * Check a compiled schema against the registry's accepted subset.
 *
 * Mirrors `assertSupportedJsonSchema` closely enough to catch the authoring
 * mistakes that would otherwise make registration throw at mount time.
 * @param schema - compiled schema.
 * @returns human-readable violations; empty means acceptable.
 */
export function validateRawSchema(schema: unknown): string[] {
  const violations: string[] = []
  const walk = (node: unknown, path: string): void => {
    if (node === null || typeof node !== 'object' || Array.isArray(node)) {
      violations.push(`${path} must be a schema object`)
      return
    }
    const record = node as Record<string, unknown>
    for (const key of Object.keys(record)) {
      if (!['type', 'oneOf', 'properties', 'required', 'additionalProperties', 'items', 'enum', 'const', ...ANNOTATIONS].includes(key)) {
        violations.push(`${path}.${key} is not a supported keyword`)
      }
    }
    if (record.type !== undefined && record.oneOf !== undefined) violations.push(`${path} cannot declare both type and oneOf`)
    if (record.oneOf !== undefined) {
      if (!Array.isArray(record.oneOf) || record.oneOf.length < 2) violations.push(`${path}.oneOf must list at least two schemas`)
      else record.oneOf.forEach((branch, index) => walk(branch, `${path}.oneOf[${index}]`))
    }
    if (record.type === 'object') {
      // The raw subset accepts an absent `additionalProperties`; when present it
      // must be a boolean. Only the author DSL insists on it explicitly.
      if (record.additionalProperties !== undefined && typeof record.additionalProperties !== 'boolean') {
        violations.push(`${path}.additionalProperties must be a boolean`)
      }
      const properties = record.properties
      if (properties !== undefined) {
        if (properties === null || typeof properties !== 'object' || Array.isArray(properties)) {
          violations.push(`${path}.properties must be an object`)
        } else {
          for (const [key, value] of Object.entries(properties)) walk(value, `${path}.properties.${key}`)
        }
      }
      if (record.required !== undefined) {
        const required = record.required
        if (!Array.isArray(required) || required.some((name) => typeof name !== 'string')) {
          violations.push(`${path}.required must be an array of strings`)
        } else if (properties !== undefined && record.properties !== null && typeof record.properties === 'object') {
          const declared = record.properties as Record<string, unknown>
          for (const name of required) {
            if (!(name in declared)) violations.push(`${path}.required names "${String(name)}", which is not declared`)
          }
        }
      }
    }
    if (record.type === 'array' && record.items !== undefined) walk(record.items, `${path}.items`)
  }
  walk(schema, 'schema')
  return violations
}