// users
// organizations
// boards
// issues

const users = [
  {
    id: 1,
    username: "prawesh123",
    password: "12345678",
  },
  {
    id: 2,
    username: "raman",
    password: "123456",
  },
];

const organizations = [
  {
    id: 1,
    title: "zomato teams",
    description: "entire backend team",
    admin: 1,
    members: [2],
  },
  {
    // Raman has created his own organization for managing his things so there is no need for access to the main admin prawesh123 because this is raman organization.
    id: 1,
    title: "raman's org",
    description: "Experimenting",
    admin: 2,
    memebers: [],
  },
];

const boards = [
  {
    id: 1,
    title: "Zomato backend team",
    organizationId: 1,
  },
];

const issues = [
  {
    id: 1,
    title: "Add dark mode",
    boardId: 1,
  },
  {
    id: 2,
    title: "Debug the order placing issue.",
  },
];
