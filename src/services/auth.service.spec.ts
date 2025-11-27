import { AuthService } from './auth.service';
import { UserRepository } from '../repositories/user.repository';

describe('AuthService', () => {
  const service = new AuthService();
  const repo = new UserRepository();

  it('registers and logs in user', async () => {
    const user = await repo.create({ email: 'a@example.com', password: 'Pass1234!', nickname: 'alice' });
    expect(user._id).toBeDefined();

    const login = await service.login('a@example.com', 'Pass1234!');
    expect(login.accessToken).toBeDefined();
    expect(login.refreshToken).toBeDefined();
    expect(login.user.email).toBe('a@example.com');
  });

  it('refreshes token', async () => {
    const reg = await service.register({ email: 'b@example.com', password: 'Pass1234!', nickname: 'bob' });
    const refreshed = await service.refreshToken(reg.refreshToken);
    expect(refreshed.accessToken).toBeDefined();
  });
});

