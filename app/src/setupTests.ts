import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Tells React this is a test environment so act() (used by React Testing
// Library) behaves correctly and does not log configuration warnings.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// React Testing Library only auto-registers its cleanup when a global
// afterEach exists. This project runs vitest with globals disabled, so the
// cleanup hook is registered explicitly here.
afterEach(() => {
  cleanup()
})
