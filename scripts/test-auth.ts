import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/auth';

async function testAuth() {
    try {
        // 1. Register
        console.log('Testing Register...');
        const registerRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123',
                nickname: 'testuser',
                name: 'Test',
                surname: 'User'
            })
        });
        const registerData = await registerRes.json();
        console.log('Register Status:', registerRes.status);
        console.log('Register Response:', registerData);

        if (registerRes.status !== 201 && registerRes.status !== 400) { // 400 if already exists
            console.error('Register failed');
        }

        // 2. Login
        console.log('\nTesting Login...');
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: 'testuser',
                password: 'password123'
            })
        });
        const loginData: any = await loginRes.json();
        console.log('Login Status:', loginRes.status);
        console.log('Login Response:', loginData);

        if (loginRes.status === 200 && loginData.accessToken) {
            // 3. Refresh Token
            console.log('\nTesting Refresh Token...');
            const refreshRes = await fetch(`${BASE_URL}/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    refreshToken: loginData.refreshToken
                })
            });
            const refreshData = await refreshRes.json();
            console.log('Refresh Token Status:', refreshRes.status);
            console.log('Refresh Token Response:', refreshData);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testAuth();
