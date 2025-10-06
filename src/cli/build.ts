#!/usr/bin/env node

import { StaticBuilder } from '../core/StaticBuilder';
import { Command } from 'commander';

const program = new Command();

program
    .name('cogsworth-build')
    .description('Build static site from markdown content')
    .version('1.0.0')
    .option('-o, --output <dir>', 'Output directory', 'dist')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options) => {
        try {
            console.log('🚀 Cogsworth Static Site Builder');
            console.log(`📁 Output directory: ${options.output}`);
            
            if (options.verbose) {
                console.log('🔍 Verbose mode enabled');
            }
            
            const builder = new StaticBuilder(options.output);
            await builder.build();
            
            console.log('✅ Build completed successfully!');
            process.exit(0);
        } catch (error) {
            console.error('❌ Build failed:', error);
            process.exit(1);
        }
    });

program.parse();

