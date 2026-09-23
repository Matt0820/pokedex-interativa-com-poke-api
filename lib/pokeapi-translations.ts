const translations: Record<string, string> = {
  'hp': 'Pontos de vida',
  'attack': 'Ataque',
  'defense': 'Defesa',
  'special-attack': 'Ataque especial',
  'special-defense': 'Defesa especial',
  'speed': 'Velocidade',
  'level-up': 'Por nível',
  'machine': 'MT',
  'tutor': 'Tutor',
  'egg': 'Ovo',
  'normal-ability': 'Normal',
  'hidden-ability': 'Oculta',
  'zygarde-10': 'Zygarde Forma 10%',
  'zygarde-50': 'Zygarde Forma 50%',
  'zygarde-complete': 'Zygarde Forma Completa',
}

export function translatePokeName(name: string) {
  return translations[name] || name.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

export function translateMoveMethod(name: string) {
  return translations[name] || translatePokeName(name)
}

export function translateDescription(entries: { flavor_text: string; language: { name: string } }[]) {
  const portuguese = entries.find((entry) => ['pt-br', 'pt'].includes(entry.language.name))
  const english = entries.find((entry) => entry.language.name === 'en')
  return (portuguese || english)?.flavor_text.replace(/[\n\f]/g, ' ') || 'Descrição ainda não disponível na PokéAPI.'
}

export async function translateDescriptionToPortuguese(text: string) {
  const normalizedText = text.replace(/[\n\f]/g, ' ').trim()
  if (!normalizedText) return 'Descrição ainda não disponível na PokéAPI.'

  try {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(normalizedText)}&langpair=en|pt-BR`)
    if (!response.ok) throw new Error('Falha ao traduzir descrição')
    const data = await response.json() as { responseData?: { translatedText?: string } }
    return data.responseData?.translatedText || normalizedText
  } catch {
    return normalizedText
  }
}