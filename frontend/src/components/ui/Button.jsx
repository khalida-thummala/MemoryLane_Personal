import React from "react"

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
    const variants = {
        default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md",
        outline: "border border-indigo-600 text-indigo-600 hover:bg-indigo-50",
        ghost: "hover:bg-indigo-50 text-indigo-600",
        danger: "bg-red-500 text-white hover:bg-red-600"
    }

    const sizes = {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-3 rounded-md",
        lg: "h-12 px-8 rounded-md",
        icon: "h-10 w-10",
    }

    const variantClass = variants[variant || "default"]
    const sizeClass = sizes[size || "default"]

    return (
        <button
            className={`inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 active:scale-95 ${variantClass} ${sizeClass} ${className}`}
            ref={ref}
            {...props}
        />
    )
})
Button.displayName = "Button"

export { Button }
