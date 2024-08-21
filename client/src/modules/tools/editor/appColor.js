// store/appColor.js
import { defineStore } from 'pinia'

export const useAppColorStore = defineStore('appColor', {
  state: () => ({
    color:
      import.meta.env.VITE_NODE_ENV === 'build'
        ? import.meta.env.VITE_BUILD_COLOR
        : import.meta.env.VITE_DEV_COLOR,
  }),
})
