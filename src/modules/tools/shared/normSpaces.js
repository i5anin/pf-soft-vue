export function normSpaces(str) {
  // Удаление лишних пробелов и преобразование строки в нижний регистр
  let normalizedStr = str.trim().replace(/\s+/g, ' ').toLowerCase()

  // Преобразование первого символа в верхний регистр
  normalizedStr = normalizedStr.charAt(0).toUpperCase() + normalizedStr.slice(1)

  // Дополнительная обработка, например, проверка языка слова, может быть добавлена здесь

  return normalizedStr
}
