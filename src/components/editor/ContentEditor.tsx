
import { useEditor, EditorContent } from '@tiptap/react';
import { getEditorExtensions, editorProps, formatContent } from './EditorConfig';
import { useEffect } from 'react';

interface ContentEditorProps {
  content: string;
  isEditing: boolean;
  className?: string;
}

export function ContentEditor({ content, isEditing, className }: ContentEditorProps) {
  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: '',
    editable: isEditing,
    editorProps: {
      ...editorProps,
      transformPastedText: (text) => formatContent(text),
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(formatContent(content));
    }
  }, [content, editor]);

  return <EditorContent editor={editor} className={className} />;
}
