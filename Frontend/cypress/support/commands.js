const testUsers = {
  student: {
    id: 'student-1',
    _id: 'student-1',
    name: 'John Student',
    email: 'john.student@example.com',
    role: 'student',
    isVerified: true,
  },
  pharmacist: {
    id: 'pharmacist-1',
    _id: 'pharmacist-1',
    name: 'Maya Pharmacist',
    email: 'maya.pharmacist@example.com',
    role: 'pharmacist',
    phone: '0771234567',
    isVerified: true,
  },
};

function getTestUser(role) {
  const user = testUsers[role];

  if (!user) {
    throw new Error(`Unsupported test role: ${role}`);
  }

  return user;
}

Cypress.Commands.add('loginAsRole', (role) => {
  const user = getTestUser(role);

  window.localStorage.setItem('token', `${role}-test-token`);
  window.localStorage.setItem('campushealth_user', JSON.stringify(user));
});

Cypress.Commands.add('visitAsRole', (path, role, options = {}) => {
  const user = getTestUser(role);

  cy.visit(path, {
    ...options,
    onBeforeLoad(win) {
      win.localStorage.setItem('token', `${role}-test-token`);
      win.localStorage.setItem('campushealth_user', JSON.stringify(user));
      options.onBeforeLoad?.(win);
    },
  });
});
