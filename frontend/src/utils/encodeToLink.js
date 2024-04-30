export const encodeToLink = (description) => {
    // Replace Markdown-style links with actual HTML anchor tags
    const processedDescription = description.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, link) => {
      return `<a class="link_style" href=${link} target="_blank" rel="noopener noreferrer">${text}</a>`;
    });
    return { __html: processedDescription };
};