export function applyTemplate(template: string, values: any): string {
  for (const key of Object.keys(values)) {
    const token = `{{${key}}}`;
    template = template.replace(new RegExp(token, "g"), values[key]);
  }

  return template;
}
