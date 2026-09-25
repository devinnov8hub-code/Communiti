/** "Created June 2006" */
export const createdLabel = (iso: string) =>
  `Created ${new Date(iso).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`
