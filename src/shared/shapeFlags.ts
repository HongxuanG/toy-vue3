// 为什么不直接用对象然后属性值是1，2，3，4，5.。。。
// export const ShapeFlags = {
//   ElEMENT: 1,
//   STATEFUL_COMPONENT: 2,
//   TEXT_CHILDREN: 3,
//   ARRAY_CHILDREN: 4,
// }
export const enum ShapeFlags {
  ELEMENT = 1,                  // 00001
  STATEFUL_COMPONENT = 1 << 1,  // 00010
  TEXT_CHILDREN = 1 << 2,       // 00100
  ARRAY_CHILDREN = 1 << 3,      // 01000
  SLOTS_CHILDREN = 1 << 4       // 10000
}
