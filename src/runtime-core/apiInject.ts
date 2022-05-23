export function provide<T>(key: string | number, value: T){
  // 提供者
  // key和value存在哪呢？挂在instance的provide属性上吧！

}
export function inject<T>(key: string, defaultValue?: unknown): T{
  // 接收者
  // 在哪里拿value呢？在instance的parent上面获取到父组件的instance然后点出provide
  
}
