
import { S3Client, ListObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCESS_KEY_ID = '2bd4dbbd3999e8ddeb188eb14648f6a6';
const R2_SECRET_ACCESS_KEY = 'd7c4536df2ae2e5143aa9d0e0ab0fb7e918a7f517944ecc26f17eb75ab192171';
const R2_BUCKET_NAME = 'storage-project';
const R2_ENDPOINT = 'https://c56a0b5deb7568b708edf3a06756423d.r2.cloudflarestorage.com';

const r2Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

async function testR2() {
    try {
        console.log('Testing R2 connection...');
        const listCommand = new ListObjectsCommand({
            Bucket: R2_BUCKET_NAME,
            MaxKeys: 1,
        });
        const listResponse = await r2Client.send(listCommand);
        console.log('List objects success:', listResponse.Contents ? listResponse.Contents.length : 0, 'objects found');

        if (listResponse.Contents && listResponse.Contents.length > 0) {
            const key = listResponse.Contents[0].Key;
            console.log('Generating signed URL for key:', key);

            // Test 1: Default (Path Style likely)
            const getCommand = new GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
            });
            const url1 = await getSignedUrl(r2Client, getCommand, { expiresIn: 3600 });
            console.log('URL 1 (Default):', url1);

            // Test 2: Virtual Hosted Style
            const r2ClientVirtual = new S3Client({
                region: 'auto',
                endpoint: R2_ENDPOINT,
                credentials: {
                    accessKeyId: R2_ACCESS_KEY_ID,
                    secretAccessKey: R2_SECRET_ACCESS_KEY,
                },
                forcePathStyle: false, // Force virtual hosted style
            });
            const url2 = await getSignedUrl(r2ClientVirtual, getCommand, { expiresIn: 3600 });
            console.log('URL 2 (Virtual Hosted):', url2);

        } else {
            console.log('No objects found in bucket to test URL generation.');
        }
    } catch (error) {
        console.error('R2 Test Failed:', error);
    }
}

testR2();
