import { AutoLinkNode } from "@lexical/link";

export class CustomAutoLinkNode extends AutoLinkNode {
  decorate() {
    const url = this.getURL();
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {this.getTextContent()}
      </a>
    );
  }
}
