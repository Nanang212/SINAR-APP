<script lang="ts">
  import { cn } from "@/lib/utils";
  import type { HTMLLabelAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  interface $$Props extends HTMLLabelAttributes {
    children?: Snippet;
  }

  let { class: className, children, ...props }: $$Props = $props();
</script>

<label
  class={cn(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    className
  )}
  {...props}
>
  {@render children?.()}
</label>
