/**
 * The collaboration terms every member accepts before asking to join (Figma "Accept Terms" /
 * "Contracts"). They are the same for every project, so they live here; each project's own
 * contract files come from `GET /projects/:id/contracts`.
 */
export const COLLABORATION_TERMS = {
  intro:
    'By joining this project, you agree to collaborate responsibly and respect the contributions of all project members.',
  terms: [
    {
      title: 'Collaboration',
      body: 'Participate respectfully, communicate professionally, and contribute according to your assigned role.',
    },
    {
      title: 'Confidentiality',
      body: 'Do not share private project information, documents, research, prototypes, or discussions outside the project without permission.',
    },
    {
      title: 'Intellectual Property',
      body: 'Ownership of ideas, designs, research, code, and other contributions will follow the agreements established by the project owner and contributors.',
    },
    {
      title: 'Use of Project Materials',
      body: 'Project files and resources should only be used for activities related to the project unless permission is granted.',
    },
    {
      title: 'Community Conduct',
      body: 'Harassment, discrimination, misuse of information, or disruptive behaviour may result in removal from the project.',
    },
    {
      title: 'Leaving the Project',
      body: 'You may leave the project at any time; however, confidentiality and applicable intellectual-property obligations may continue after you leave.',
    },
    {
      title: 'Project Changes',
      body: 'The project owner may update project roles, requirements, or collaboration arrangements as the project develops.',
    },
  ],
}
