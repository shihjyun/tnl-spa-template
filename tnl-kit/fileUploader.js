#!/usr/bin/env node
const { program } = require('commander');
const { exec } = require('child_process');

const defaultProjectPath = __dirname.split('/')
const defaultProjectName = defaultProjectPath[defaultProjectPath.length - 2]

// upload command
program
  .version('0.0.1')
  .command('upload [project] <file>')
  .description('upload files to GCS')
  .action(uploadBuildFileToGCS)


program.parse(process.argv);


function uploadBuildFileToGCS(project, file){

  const finalProjectName = project ? project : defaultProjectName
  // tnl graphic bucket
  const destinationBucket = 'gs://datastore.thenewslens.com/infographic/' + finalProjectName + '/'
  const fileDirectories = './public/assets/gcs-assets/' + file
  // paste full cli let gsutil upload the single files
  const fullCommandLine = `gsutil cp ${fileDirectories} ${destinationBucket}`

  exec(fullCommandLine, (error, stdout, stderr) => {
    console.log(`${stdout}`);
    console.log(`${stderr}`);
    if (error !== null) {
        console.log(`exec error: ${error}`);
    }
  })
}

  

