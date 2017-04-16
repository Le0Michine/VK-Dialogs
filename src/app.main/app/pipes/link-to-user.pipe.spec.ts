import { LinkToUserPipe } from './link-to-user.pipe';

describe('LinkToUser pipe', () => {
    let pipe: LinkToUserPipe;

    beforeEach(() => {
        pipe = new LinkToUserPipe();
    });

    it('should transform user id into link to the user profile', () => {
        // arrange
        const userId = 12345;
        const profileLink = 'https://vk.com/id12345';

        // act
        const result = pipe.transform(userId);

        // assert
        expect(result).toBe(profileLink);
    });
});
