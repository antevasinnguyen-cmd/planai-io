import { Client } from '@notionhq/client';

/**
 * Export financial plan to Notion
 * @param title Plan title
 * @param content Plan content in structured format
 * @param accessToken User's Notion access token
 * @returns URL to the created Notion page
 */
export async function exportToNotion(
  title: string,
  content: any,
  accessToken: string
): Promise<string> {
  try {
    // Initialize Notion client with user's access token
    const notion = new Client({ auth: accessToken });
    
    // Create a new page in the user's Notion workspace
    const response = await notion.pages.create({
      parent: {
        type: 'workspace',
        workspace: true
      },
      icon: {
        type: 'emoji',
        emoji: '📊'
      },
      cover: {
        type: 'external',
        external: {
          url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80'
        }
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: `PlanAI: ${title}`
              }
            }
          ]
        }
      },
      children: createNotionBlocks(content)
    });

    return response.url;
  } catch (error) {
    console.error('Notion export error:', error);
    throw new Error('Failed to export to Notion');
  }
}

/**
 * Create Notion blocks from plan content
 */
function createNotionBlocks(content: any): any[] {
  const blocks: any[] = [
    {
      object: 'block',
      type: 'heading_1',
      heading_1: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Financial Plan'
            },
            annotations: {
              bold: true,
              color: 'blue'
            }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: `Generated on ${new Date().toLocaleDateString()}`
            },
            annotations: {
              italic: true
            }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'divider',
      divider: {}
    }
  ];

  // Add summary section
  if (content.summary) {
    blocks.push(
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'Summary'
              },
              annotations: {
                bold: true
              }
            }
          ]
        }
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: content.summary
              }
            }
          ]
        }
      }
    );
  }

  // Add goals section
  if (content.goals) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Financial Goals'
            },
            annotations: {
              bold: true
            }
          }
        ]
      }
    });

    if (Array.isArray(content.goals)) {
      content.goals.forEach((goal: string) => {
        blocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: goal
                }
              }
            ]
          }
        });
      });
    } else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: content.goals
              }
            }
          ]
        }
      });
    }
  }

  // Add strategies section
  if (content.strategies) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Strategies'
            },
            annotations: {
              bold: true
            }
          }
        ]
      }
    });

    if (typeof content.strategies === 'object' && !Array.isArray(content.strategies)) {
      Object.entries(content.strategies).forEach(([key, value]) => {
        blocks.push(
          {
            object: 'block',
            type: 'heading_3',
            heading_3: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: key
                  },
                  annotations: {
                    bold: true
                  }
                }
              ]
            }
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: value as string
                  }
                }
              ]
            }
          }
        );
      });
    } else if (Array.isArray(content.strategies)) {
      content.strategies.forEach((strategy: string) => {
        blocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: strategy
                }
              }
            ]
          }
        });
      });
    } else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: content.strategies
              }
            }
          ]
        }
      });
    }
  }

  // Add timeline section
  if (content.timeline) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Timeline'
            },
            annotations: {
              bold: true
            }
          }
        ]
      }
    });

    if (typeof content.timeline === 'object' && !Array.isArray(content.timeline)) {
      const tableRows = Object.entries(content.timeline).map(([key, value]) => {
        return [
          {
            type: 'text',
            text: {
              content: key
            },
            annotations: {
              bold: true
            }
          },
          {
            type: 'text',
            text: {
              content: value as string
            }
          }
        ];
      });

      blocks.push({
        object: 'block',
        type: 'table',
        table: {
          table_width: 2,
          has_column_header: true,
          has_row_header: false,
          children: [
            {
              object: 'block',
              type: 'table_row',
              table_row: {
                cells: [
                  [
                    {
                      type: 'text',
                      text: {
                        content: 'Period'
                      },
                      annotations: {
                        bold: true
                      }
                    }
                  ],
                  [
                    {
                      type: 'text',
                      text: {
                        content: 'Action'
                      },
                      annotations: {
                        bold: true
                      }
                    }
                  ]
                ]
              }
            },
            ...tableRows.map(row => ({
              object: 'block',
              type: 'table_row',
              table_row: {
                cells: [
                  [row[0]],
                  [row[1]]
                ]
              }
            }))
          ]
        }
      });
    } else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: content.timeline
              }
            }
          ]
        }
      });
    }
  }

  // Add budget section
  if (content.budget) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Budget'
            },
            annotations: {
              bold: true
            }
          }
        ]
      }
    });

    if (typeof content.budget === 'object' && !Array.isArray(content.budget)) {
      const tableRows = Object.entries(content.budget).map(([key, value]) => {
        return [
          {
            type: 'text',
            text: {
              content: key
            },
            annotations: {
              bold: true
            }
          },
          {
            type: 'text',
            text: {
              content: typeof value === 'number' ? value.toLocaleString() : value as string
            }
          }
        ];
      });

      blocks.push({
        object: 'block',
        type: 'table',
        table: {
          table_width: 2,
          has_column_header: true,
          has_row_header: false,
          children: [
            {
              object: 'block',
              type: 'table_row',
              table_row: {
                cells: [
                  [
                    {
                      type: 'text',
                      text: {
                        content: 'Category'
                      },
                      annotations: {
                        bold: true
                      }
                    }
                  ],
                  [
                    {
                      type: 'text',
                      text: {
                        content: 'Amount'
                      },
                      annotations: {
                        bold: true
                      }
                    }
                  ]
                ]
              }
            },
            ...tableRows.map(row => ({
              object: 'block',
              type: 'table_row',
              table_row: {
                cells: [
                  [row[0]],
                  [row[1]]
                ]
              }
            }))
          ]
        }
      });
    } else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: content.budget
              }
            }
          ]
        }
      });
    }
  }

  return blocks;
}

/**
 * Get OAuth URL for Notion authorization
 */
export function getNotionAuthUrl(): string {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.NOTION_REDIRECT_URI || '');
  
  return `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
}

/**
 * Exchange authorization code for access token
 */
export async function getNotionAccessToken(code: string): Promise<string> {
  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  const response = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })
  });

  const data = await response.json();
  return data.access_token;
}
