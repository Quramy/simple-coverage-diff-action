import * as Main from "./main"

test(Main.foo.name, () => {
  expect(Main.foo("A")).toBe("A")
})

test(Main.hoge.name, () => {
  expect(Main.hoge()).toBe("hoge")
})
