import {
  forwardRef,
  InputHTMLAttributes,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export default forwardRef(function TextInput(
  {
    type = "text",
    className = "",
    isFocused = false,
    id,
    label,
    ...props
  }: InputHTMLAttributes<HTMLInputElement> & {
    isFocused?: boolean;
    label?: string;
  },
  ref
) {
  const localRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => localRef.current?.focus(),
  }));

  useEffect(() => {
    if (isFocused) {
      localRef.current?.focus();
    }
  }, [isFocused]);

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="absolute -top-2 left-2.5 px-1 text-xs font-semibold bg-white text-neutral-600"
      >
        {label}
      </label>
      <input
        {...props}
        type={type}
        id={id}
        name={id}
        className={
          "w-full px-4 py-3.5 outline-none rounded-lg border-2 border-neutral-200 hover:border-neutral-400 focus:border-neutral-800 transition-all ease-in-out duration-300 " +
          className
        }
        ref={localRef}
      />
    </div>
  );
});
