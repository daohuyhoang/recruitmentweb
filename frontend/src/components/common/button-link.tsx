import type { VariantProps } from "class-variance-authority"
import { Link, type LinkProps } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Liên kết trông như nút. Dùng thay cho <Button render={<Link />}>, vì Base UI gắn role="button" làm mất ngữ nghĩa liên kết. */
export function ButtonLink({ className, variant, size, ...props }: LinkProps & VariantProps<typeof buttonVariants>) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
