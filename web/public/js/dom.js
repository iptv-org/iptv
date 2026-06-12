// Utilitários de DOM seguros. Nunca usamos innerHTML com dados vindos da API —
// todo texto entra via textContent e todo atributo via setAttribute, evitando
// XSS através de nome de canal, logo, etc.

/**
 * Cria um elemento com atributos e filhos de forma segura.
 * @param {string} tag
 * @param {object} attrs atributos (class, src, etc.). Texto vai em `text`.
 * @param {Array<Node|string>} children
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue
    if (key === 'class') node.className = value
    else if (key === 'text') node.textContent = value
    else if (key === 'dataset') Object.assign(node.dataset, value)
    else node.setAttribute(key, value)
  }
  for (const child of children) {
    node.append(child instanceof Node ? child : document.createTextNode(String(child)))
  }
  return node
}

/**
 * Valida uma URL para uso em atributos (logo, stream). Só aceita http/https,
 * impedindo esquemas perigosos como javascript: ou data:.
 */
export function safeHttpUrl(url) {
  if (typeof url !== 'string' || url === '') return null
  try {
    const parsed = new URL(url, window.location.origin)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString()
  } catch {
    /* ignore */
  }
  return null
}

export function clear(node) {
  node.replaceChildren()
}
