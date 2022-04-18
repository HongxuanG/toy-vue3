import { sum } from './add'

it('first jest case', () => {
  expect(sum(0.2, 0.1)).toBeCloseTo(0.3)
})
