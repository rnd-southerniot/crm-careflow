import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateEmails() {
    console.log('🔄 Migrating users from @arits.ltd to @southerneleven.com...');

    const oldDomain = '@arits.ltd';
    const newDomain = '@southerneleven.com';

    // Find all users with old domain
    const usersWithOldDomain = await prisma.user.findMany({
        where: {
            email: {
                endsWith: oldDomain,
            },
        },
        include: {
            assignedTasks: true,
            technicalReports: true,
            deviceProvisionings: true,
        },
    });

    console.log(`Found ${usersWithOldDomain.length} user(s) with old email domain`);

    // For each old user, check if new user exists and merge/delete
    for (const oldUser of usersWithOldDomain) {
        const newEmail = oldUser.email.replace(oldDomain, newDomain);

        const existingNewUser = await prisma.user.findUnique({
            where: { email: newEmail },
        });

        if (existingNewUser) {
            console.log(`\n📋 Found duplicate: ${oldUser.email} and ${newEmail}`);
            console.log(`   Old user has:`);
            console.log(`   - ${oldUser.assignedTasks.length} assigned tasks`);
            console.log(`   - ${oldUser.technicalReports.length} technical reports`);
            console.log(`   - ${oldUser.deviceProvisionings.length} device provisionings`);

            // Transfer all related data to the new user
            if (oldUser.assignedTasks.length > 0) {
                await prisma.onboardingTask.updateMany({
                    where: { assignedUserId: oldUser.id },
                    data: { assignedUserId: existingNewUser.id },
                });
                console.log(`   ✅ Transferred ${oldUser.assignedTasks.length} tasks to new user`);
            }

            if (oldUser.technicalReports.length > 0) {
                await prisma.technicalReport.updateMany({
                    where: { submittedBy: oldUser.id },
                    data: { submittedBy: existingNewUser.id },
                });
                console.log(`   ✅ Transferred ${oldUser.technicalReports.length} reports to new user`);
            }

            if (oldUser.deviceProvisionings.length > 0) {
                await prisma.deviceProvisioning.updateMany({
                    where: { provisionedBy: oldUser.id },
                    data: { provisionedBy: existingNewUser.id },
                });
                console.log(`   ✅ Transferred ${oldUser.deviceProvisionings.length} provisionings to new user`);
            }

            // Now delete the old user
            await prisma.user.delete({
                where: { id: oldUser.id },
            });
            console.log(`   🗑️  Deleted old user: ${oldUser.email}`);
        } else {
            // No duplicate, just update the email
            await prisma.user.update({
                where: { id: oldUser.id },
                data: { email: newEmail },
            });
            console.log(`✅ Updated: ${oldUser.email} → ${newEmail}`);
        }
    }

    console.log('\n✨ Email migration complete!');
}

updateEmails()
    .catch((e) => {
        console.error('❌ Error updating emails:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
