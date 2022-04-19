import { setDataWithoutRepeat } from './setDataWithoutRepeat'
describe('setDataWithoutRepeat test', () => {
  let context = {
    data: {
      test: {
        name: 'xiaohong',
        age: 18,
        deepObj: {
          info: 'sss',
          other: 111
        }
      }
    }
  }
  it('equal', () => {
    let data = {
      test: {
        name: 'xiaohong',
        age: 18,
        deepObj: {
          info: 'sss',
          other: 111
        }
      }
    }
    expect(setDataWithoutRepeat(context, data)).toBe(null)
  })
  it('deep property changed', () => {
    let data = {
      test: {
        name: 'xiaohong',
        age: 18,
        deepObj: {
          info: 'sss',
          other: 'changed'
        }
      }
    }
    const result = {
      test: {
        deepObj: {
          other: 'changed'
        }
      }
    }
    expect(setDataWithoutRepeat(context, data)).toEqual(result)
  })
  it('incream new property', () => {
    let data = {
      test: {
        name: 'xiaohong',
        age: 18,
        deepObj: {
          info: 'sss',
          other: 'changed',
          new: 'new property'
        }
      }
    }
    const result = {
      test: {
        deepObj: {
          new: 'new property',
          other: 'changed'
        }
      }
    }
    expect(setDataWithoutRepeat(context, data)).toEqual(result)
  })
})
