// no-composition-api.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Запрещает использование Composition API',
      category: 'Vue',
      recommended: 'warn',
    },
    fixable: null,
    schema: [],
  },

  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'setup') {
          context.report({
            node,
            message: 'Использование Composition API запрещено.',
          })
        }
      },
      'Property[key.name="setup"]'(node) {
        context.report({
          node,
          message: 'Использование Composition API запрещено.',
        })
      },
      // Добавьте другие правила для проверки Composition API, например:
      // - Проверка на использование хуков Composition API (ref, reactive, etc.)
      // - Проверка на использование директив Composition API в шаблонах (v-bind="...as props", etc.)
    }
  },
}
