import { foo } from "./main"

test(foo.name, () => {
  expect(foo("A")).toBe("A")
})
