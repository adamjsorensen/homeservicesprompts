
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
import { type Extensions } from '@tiptap/react';

export const getEditorExtensions = (): Extensions => [
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
];

export const editorProps = {
  attributes: {
    class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none [&>h1]:text-2xl [&>h1]:mt-4 [&>h1]:mb-2 [&>h2]:text-xl [&>h2]:mt-3 [&>h2]:mb-2 [&>h3]:text-lg [&>h3]:mt-2 [&>h3]:mb-1',
  },
};

export const formatContent = (content: string): string => {
  return content
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
};
