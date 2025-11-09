/**
 * Diagram storage and resource management
 */

import { DiagramMetadata, DiagramPreview } from "../types/diagram.js";
import {
  generateDiagramId,
  generateDiagramUri,
  generateMetadataUri,
  generatePreviewUri,
} from "../utils/idGenerator.js";

export interface StoredDiagram {
  id: string;
  title: string;
  xml: string;
  metadata: DiagramMetadata;
  filePath?: string;
  created: Date;
  accessed: Date;
}

/**
 * In-memory diagram store with TTL support
 */
class DiagramStore {
  private diagrams: Map<string, StoredDiagram> = new Map();
  private readonly TTL_MS = 3600000; // 1 hour

  /**
   * Store a diagram and return its ID
   */
  store(
    title: string,
    xml: string,
    metadata: Partial<DiagramMetadata>,
    filePath?: string
  ): string {
    const id = generateDiagramId(title);
    const now = new Date();

    const fullMetadata: DiagramMetadata = {
      id,
      title,
      type: metadata.type || "custom",
      created: now.toISOString(),
      modified: now.toISOString(),
      format: metadata.format || "uncompressed",
      pageWidth: metadata.pageWidth || 1100,
      pageHeight: metadata.pageHeight || 850,
      elementCount: this.countElements(xml),
      connectionCount: this.countConnections(xml),
      size: xml.length,
    };

    this.diagrams.set(id, {
      id,
      title,
      xml,
      metadata: fullMetadata,
      filePath,
      created: now,
      accessed: now,
    });

    // Schedule cleanup
    setTimeout(() => this.cleanupExpired(), this.TTL_MS);

    return id;
  }

  /**
   * Retrieve a diagram by ID
   */
  get(id: string): StoredDiagram | null {
    const diagram = this.diagrams.get(id);
    if (diagram) {
      diagram.accessed = new Date();
      return diagram;
    }
    return null;
  }

  /**
   * Get diagram XML
   */
  getXml(id: string): string | null {
    const diagram = this.get(id);
    return diagram?.xml || null;
  }

  /**
   * Get diagram metadata
   */
  getMetadata(id: string): DiagramMetadata | null {
    const diagram = this.get(id);
    return diagram?.metadata || null;
  }

  /**
   * Get diagram preview (first 500 chars + metadata)
   */
  getPreview(id: string): DiagramPreview | null {
    const diagram = this.get(id);
    if (!diagram) return null;

    return {
      id: diagram.id,
      title: diagram.title,
      type: diagram.metadata.type,
      preview: diagram.xml.substring(0, 500),
      metadata: diagram.metadata,
    };
  }

  /**
   * List all stored diagrams
   */
  list(): DiagramMetadata[] {
    return Array.from(this.diagrams.values()).map((d) => d.metadata);
  }

  /**
   * Delete a diagram
   */
  delete(id: string): boolean {
    return this.diagrams.delete(id);
  }

  /**
   * Clean up expired diagrams
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [id, diagram] of this.diagrams.entries()) {
      if (now - diagram.accessed.getTime() > this.TTL_MS) {
        this.diagrams.delete(id);
      }
    }
  }

  /**
   * Count elements in XML
   */
  private countElements(xml: string): number {
    const matches = xml.match(/vertex="1"/g);
    return matches ? matches.length : 0;
  }

  /**
   * Count connections in XML
   */
  private countConnections(xml: string): number {
    const matches = xml.match(/edge="1"/g);
    return matches ? matches.length : 0;
  }

  /**
   * Get resource URIs for a diagram
   */
  getResourceUris(id: string): {
    diagram: string;
    preview: string;
    metadata: string;
  } {
    return {
      diagram: generateDiagramUri(id),
      preview: generatePreviewUri(id),
      metadata: generateMetadataUri(id),
    };
  }
}

// Singleton instance
export const diagramStore = new DiagramStore();
