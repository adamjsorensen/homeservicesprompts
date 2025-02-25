import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Layout } from "@/components/layout/Layout";
import { Copy, ArrowLeft, Edit2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import CodeBlock from '@tiptap/extension-code-block';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Blockquote from '@tiptap/extension-blockquote';
import Typography from '@tiptap/extension-typography';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

export function SavedGeneration() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const { data: generation, isLoading } = useQuery({
    queryKey: ["saved-generation", slug],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("saved_generations")
        .select()
        .eq("slug", slug)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        heading: false,
        blockquote: false,
      }),
      Typography,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-500 hover:underline',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 rounded-md p-2 font-mono text-sm',
        },
      }),
      Heading.configure({
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: 'font-bold',
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc list-inside my-2',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal list-inside my-2',
        },
      }),
      ListItem,
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-4 border-gray-300 pl-4 my-2 italic',
        },
      }),
      Table.configure({
        HTMLAttributes: {
          class: 'min-w-full border-collapse my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b border-gray-200',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border px-4 py-2',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border px-4 py-2 bg-gray-50 font-semibold',
        },
      }),
    ],
    content: generation?.content || "",
    editable: isEditing,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none [&>h1]:text-2xl [&>h1]:mt-4 [&>h1]:mb-2 [&>h2]:text-xl [&>h2]:mt-3 [&>h2]:mb-2 [&>h3]:text-lg [&>h3]:mt-2 [&>h3]:mb-1',
      },
      transformPastedText: (text) => {
        return text
          .replace(/^### (.*$)/gm, '<h3>$1</h3>')
          .replace(/^## (.*$)/gm, '<h2>$1</h2>')
          .replace(/^# (.*$)/gm, '<h1>$1</h1>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/^- (.*$)/gm, '<li>$1</li>')
          .replace(/^([\|\-]+)$/gm, (match) => {
            if (match.includes('|')) {
              return '</tr></thead><tbody>';
            }
            return '';
          })
          .replace(/^\|(.*)\|$/gm, (_, content) => {
            const cells = content.split('|')
              .map(cell => cell.trim())
              .filter(cell => cell !== '')
              .map(cell => {
                if (cell.includes('---')) {
                  return '';
                }
                return `<td>${cell}</td>`;
              })
              .join('');
            
            if (cells) {
              return `<tr>${cells}</tr>`;
            }
            return '';
          })
          .replace(/^([^<].*)\n\|([-|\s]+)\|/gm, (_, header, separator) => {
            const headers = header.split('|')
              .map(h => h.trim())
              .filter(h => h !== '')
              .map(h => `<th>${h}</th>`)
              .join('');
            return `<table><thead><tr>${headers}</tr>`;
          });
      },
    },
  });

  useEffect(() => {
    if (editor && generation?.content) {
      const formattedContent = generation.content
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/^([\|\-]+)$/gm, (match) => {
          if (match.includes('|')) {
            return '</tr></thead><tbody>';
          }
          return '';
        })
        .replace(/^\|(.*)\|$/gm, (_, content) => {
          const cells = content.split('|')
            .map(cell => cell.trim())
            .filter(cell => cell !== '')
            .map(cell => {
              if (cell.includes('---')) {
                return '';
              }
              return `<td>${cell}</td>`;
            })
            .join('');
          
          if (cells) {
            return `<tr>${cells}</tr>`;
          }
          return '';
        })
        .replace(/^([^<].*)\n\|([-|\s]+)\|/gm, (_, header, separator) => {
          const headers = header.split('|')
            .map(h => h.trim())
            .filter(h => h !== '')
            .map(h => `<th>${h}</th>`)
            .join('');
          return `<table><thead><tr>${headers}</tr>`;
        });
      
      editor.commands.setContent(formattedContent);
    }
  }, [generation, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editor?.getHTML() || generation?.content || "");
      toast({
        description: "Content copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to copy content",
      });
    }
  };

  const handleSave = async () => {
    if (!editor || !generation) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("saved_generations")
        .update({ content: editor.getHTML() })
        .eq('user_id', user.id)
        .eq('slug', slug);

      if (error) throw error;

      setIsEditing(false);
      toast({
        description: "Content saved successfully",
      });
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        variant: "destructive",
        description: "Failed to save content",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!generation) {
    return <div>Generation not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>{generation.title}</CardTitle>
          <CardDescription>
            Review and edit your saved content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`prose max-w-none ${isEditing ? 'border rounded-md p-4' : ''}`}>
            <EditorContent editor={editor} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCopy}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          {isEditing ? (
            <Button
              variant="default"
              onClick={handleSave}
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
