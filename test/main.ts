export function foo(a: string, b?: string) {
  if (!b) {
    return a
  } else {
    return `${a}${b}`
  }
}

export function hoge() {
  return "hoge"
}
