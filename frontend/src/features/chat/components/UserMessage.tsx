interface UserMessageProps {
  content: string;
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-xs bg-amber-500 px-4 py-3 text-base font-medium text-slate-950 shadow-md sm:max-w-[75%]">
        {content}
      </div>
    </div>
  );
}

