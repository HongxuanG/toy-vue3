const queue: any[] = []
let isFlushPending = false
const resolvePromise = Promise.resolve()
export const queueJobs = (job: any) => {
  if (!queue.includes(job)) {
    queue.push(job)
  }
  queueFlush(queue)
}
const queueFlush = (queue: any[]) => {
  // isFlushPending 是为了不让创建那么多个 promise
  if (isFlushPending) return
  isFlushPending = true
  // 把 instance.update放到微任务里面执行
  nextTick(flushJobs)
}
const flushJobs = () => {
  isFlushPending = false
  let job
  while ((job = queue.shift())) {
    job && job()
  }
}
type NextTickCallback = (...arg: any) => void
export const nextTick = (callback: NextTickCallback) => {
  return callback ? resolvePromise.then(callback) : resolvePromise
}
