import { methodAndPathToName } from '../naming-utilities';

describe('Naming Utilities', function() {
  describe('Method and Path to Name', function() {
    const pairs = [
      {
        path: '/self/apis/:apiId/snapshots/:snapshotId',
        method: 'GET',
        expectedName: 'getSelfApiSnapshotByApiIdAndSnapshotId',
      },
      {
        path: '/teams/:teamId/apis/:apiId',
        method: 'GET',
        expectedName: 'getTeamApiByTeamIdAndApiId',
      },
      {
        path: '/teams/:teamId/apis/:apiId/snapshots/:snapshotId',
        method: 'GET',
        expectedName: 'getTeamApiSnapshotByTeamIdAndApiIdAndSnapshotId',
      },
      {
        path: '/self/api-tokens',
        method: 'GET',
        expectedName: 'getSelfApiTokens',
      },
      {
        path: '/self/api-tokens',
        method: 'POST',
        expectedName: 'postSelfApiTokens',
      },
      {
        path: '/self/api-tokens/:token',
        method: 'DELETE',
        expectedName: 'deleteSelfApiTokenByToken',
      },
      {
        path: '/self/apis',
        method: 'POST',
        expectedName: 'postSelfApis',
      },
      {
        path: '/teams/:teamId',
        method: 'GET',
        expectedName: 'getTeamByTeamId',
      },
      {
        path: '/self/memberships',
        method: 'GET',
        expectedName: 'getSelfMemberships',
      },
      {
        path: '/self',
        method: 'GET',
        expectedName: 'getSelf',
      },
      {
        path: '/teams/:teamId/invite/accept',
        method: 'POST',
        expectedName: 'postTeamInviteAcceptByTeamId',
      },
      {
        path: '/self/apis/:apiId',
        method: 'GET',
        expectedName: 'getSelfApiByApiId',
      },
      {
        path: '/teams/:teamId/invite',
        method: 'POST',
        expectedName: 'postTeamInviteByTeamId',
      },
      {
        path: '/self/apis/:apiId/snapshots',
        method: 'POST',
        expectedName: 'postSelfApiSnapshotsByApiId',
      },
      {
        path: '/teams/:teamId/apis/:apiId/snapshots',
        method: 'POST',
        expectedName: 'postTeamApiSnapshotsByTeamIdAndApiId',
      },
    ];

    for (const pair of pairs) {
      const { method, path, expectedName } = pair;
      it(`${method} ${path} should be ${expectedName}`, function() {
        expect(methodAndPathToName(method, path)).toEqual(expectedName);
      });
    }
  });
});
