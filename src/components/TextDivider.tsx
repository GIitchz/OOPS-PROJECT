import React from 'react'

interface TextDividerProps {
    text: string;
}

const TextDivider = ({ text }: TextDividerProps) => {
    return (
        <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-green-400 text-sm font-bold uppercase tracking-wider">
                {text}
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
        </div>
    );
}

export default TextDivider;