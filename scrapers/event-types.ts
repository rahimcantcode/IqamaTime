export interface JsonLdEvent {
  '@type'?: string
  name?: string
  description?: string
  startDate?: string
  image?: string | string[]
  url?: string
  location?: { name?: string; address?: { streetAddress?: string } }
}
