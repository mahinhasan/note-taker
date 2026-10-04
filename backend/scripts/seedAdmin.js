const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const { hashPassword } = require('../src/utils/password');

function readArgs() {
  const args = Object.fromEntries(
    process.argv.slice(2)
      .filter((arg) => arg.startsWith('--') && arg.includes('='))
      .map((arg) => {
        const [key, ...rest] = arg.slice(2).split('=');
        return [key, rest.join('=')];
      })
  );

  return {
    name: args.name || process.env.ADMIN_NAME || 'Administrator',
    email: (args.email || process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
    password: args.password || process.env.ADMIN_PASSWORD || '',
  };
}

async function main() {
  const { name, email, password } = readArgs();

  if (!email || !password) {
    throw new Error('Provide ADMIN_EMAIL and ADMIN_PASSWORD (env) or --email= and --password= (args)');
  }
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Admin password must be at least 8 characters and at most 72 bytes');
  }

  await connectDB();
  await User.init();

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Admin ${email} already exists, nothing to do.`);
    } else {
      existing.role = 'admin';
      await existing.save();
      console.log(`Existing user ${email} promoted to admin.`);
    }
    return;
  }

  const passwordHash = await hashPassword(password);
  const admin = await User.create({ name, email, passwordHash, role: 'admin' });
  console.log(`Admin created: ${admin.email} (${admin._id})`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
