export function reactivity(target: Record<string, any>){
  return new Proxy(target, {
    set(target, key, value, receiver){

    },
    get()
  })
}
