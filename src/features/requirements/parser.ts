/**
 * Requirement Parser
 * Parses PRDs and product requirements documents
 */

import { logger } from '../../utils/logger';
import { ParserError } from '../../utils/errors';

export interface ParsedRequirement {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  userStories?: string[];
}

export class RequirementParser {
  parsePRD(content: string): ParsedRequirement[] {
    logger.info('Parsing PRD content...');

    try {
      // Basic parsing logic - can be enhanced
      const requirements: ParsedRequirement[] = [];
      const sections = content.split(/\n##\s+/);

      for (const section of sections) {
        if (section.trim()) {
          const lines = section.split('\n');
          const title = lines[0]?.trim() || 'Untitled';
          const description = lines.slice(1).join('\n').trim();

          requirements.push({
            title,
            description,
            acceptanceCriteria: this.extractAcceptanceCriteria(description),
          });
        }
      }

      return requirements;
    } catch (error) {
      throw new ParserError('Failed to parse PRD', error instanceof Error ? error.message : String(error));
    }
  }

  private extractAcceptanceCriteria(text: string): string[] {
    const criteria: string[] = [];
    const criteriaRegex = /(?:AC|Acceptance Criteria|Given|When|Then):\s*(.+)/gi;
    let match;

    while ((match = criteriaRegex.exec(text)) !== null) {
      criteria.push(match[1].trim());
    }

    return criteria;
  }
}


