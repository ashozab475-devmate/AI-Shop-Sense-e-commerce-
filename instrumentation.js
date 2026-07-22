export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('Manual pricing mode — automated scheduler disabled');
  }
}
