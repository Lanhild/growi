import type { Schema as SanitizeOption } from 'hast-util-sanitize';
import type {
  Code, Node, Parent,
} from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

const SUPPORTED_ATTRIBUTES = ['diagramIndex', 'bol', 'eol'];

declare module 'mdast' {
  interface Data {
    hName?: string,
    hProperties?: {
      diagramIndex?: number,
      bol?: number,
      eol?: number,
      key?: string,
    }
  }
}

type Lang = 'drawio';

function isDrawioBlock(lang?: string | null): lang is Lang {
  return /^drawio$/.test(lang ?? '');
}

function rewriteNode(node: Node, index: number) {

  node.type = 'paragraph';
  (node as Parent).children = [{ type: 'text', value: (node as Code).value }];

  const data = node.data ?? (node.data = {});
  data.hName = 'drawio';
  data.hProperties = {
    diagramIndex: index,
    bol: node.position?.start.line,
    eol: node.position?.end.line,
    key: `drawio-${index}`,
  };
}

export const remarkPlugin: Plugin = function() {
  return (tree) => {
    visit(tree, (node, index) => {
      if (node.type === 'code') {
        if (isDrawioBlock((node as Code).lang)) {
          rewriteNode(node, index ?? 0);
        }
      }
    });
  };
};

export const sanitizeOption: SanitizeOption = {
  tagNames: ['drawio'],
  attributes: {
    drawio: SUPPORTED_ATTRIBUTES,
  },
};
