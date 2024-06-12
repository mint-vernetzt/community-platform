We haven't found a way to import modules from the base repo to use it in the tsoa workspace (common/api) yet.
These modules are f.e. the prisma client, imgproxy helper or other utility functions we want to share.

As a workarround this folder (src/cp-modules) contains copies of shared modules from the base repo.
The source of truth is the app/ folder inside the base repo, so please just copy from the base repo to this folder and not vice versa.
