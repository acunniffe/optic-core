import { methodAndPathToName } from '../naming-utilities';

describe('Naming Utilities', function() {
  describe('Method and Path to Name', function() {
    const pairs = [
      {
        path: '/self/apis/:apiId/snapshots/:snapshotId',
        method: 'GET',
        expected: {
          requestName: 'getSelfApiSnapshotByApiIdAndSnapshotId',
          resourceName: 'selfApiSnapshot',
        },
      },
      {
        path: '/teams/:teamId/apis/:apiId',
        method: 'GET',
        expected: {
          requestName: 'getTeamApiByTeamIdAndApiId',
          resourceName: 'teamApi',
        },
      },
      {
        path: '/teams/:teamId/apis/:apiId/snapshots/:snapshotId',
        method: 'GET',
        expected: {
          requestName: 'getTeamApiSnapshotByTeamIdAndApiIdAndSnapshotId',
          resourceName: 'teamApiSnapshot',
        },
      },
      {
        path: '/self/api-tokens',
        method: 'GET',
        expected: {
          requestName: 'getSelfApiTokens',
          resourceName: 'selfApiTokens',
        },
      },
      {
        path: '/self/api-tokens',
        method: 'POST',
        expected: {
          requestName: 'postSelfApiToken',
          resourceName: 'selfApiToken',
        },
      },
      {
        path: '/self/api-tokens/:token',
        method: 'DELETE',
        expected: {
          requestName: 'deleteSelfApiTokenByToken',
          resourceName: 'selfApiToken',
        },
      },
      {
        path: '/self/apis',
        method: 'POST',
        expected: {
          requestName: 'postSelfApi',
          resourceName: 'selfApi',
        },
      },
      {
        path: '/teams/:teamId',
        method: 'GET',
        expected: {
          requestName: 'getTeamByTeamId',
          resourceName: 'team',
        },
      },
      {
        path: '/self/memberships',
        method: 'GET',
        expected: {
          requestName: 'getSelfMemberships',
          resourceName: 'selfMemberships',
        },
      },
      {
        path: '/self',
        method: 'GET',
        expected: {
          requestName: 'getSelf',
          resourceName: 'self',
        },
      },
      {
        path: '/teams/:teamId/invite/accept',
        method: 'POST',
        expected: {
          requestName: 'postTeamInviteAcceptByTeamId',
          resourceName: 'teamInviteAccept',
        },
      },
      {
        path: '/self/apis/:apiId',
        method: 'GET',
        expected: {
          requestName: 'getSelfApiByApiId',
          resourceName: 'selfApi',
        },
      },
      {
        path: '/teams/:teamId/invite',
        method: 'POST',
        expected: {
          requestName: 'postTeamInviteByTeamId',
          resourceName: 'teamInvite',
        },
      },
      {
        path: '/self/apis/:apiId/snapshots',
        method: 'POST',
        expected: {
          requestName: 'postSelfApiSnapshotByApiId',
          resourceName: 'selfApiSnapshot',
        },
      },
      {
        path: '/teams/:teamId/apis/:apiId/snapshots',
        method: 'POST',
        expected: {
          requestName: 'postTeamApiSnapshotByTeamIdAndApiId',
          resourceName: 'teamApiSnapshot',
        },
      },
    ];

    for (const pair of pairs) {
      const { method, path, expected } = pair;
      it(`requestName for ${method} ${path} should be ${expected.requestName}`, function() {
        expect(methodAndPathToName(method, path).requestName).toEqual(expected.requestName);
      });
      it(`resourceName for ${method} ${path} should be ${expected.resourceName}`, function() {
        expect(methodAndPathToName(method, path).resourceName).toEqual(expected.resourceName);
      });
    }
  });
});
