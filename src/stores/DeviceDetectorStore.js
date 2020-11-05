import { writable } from "svelte/store";

let isMobile = writable(false)

export { isMobile }