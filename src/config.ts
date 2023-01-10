import core from '@actions/core';
import github from '@actions/github';
import {parseMemory} from './memory';

export interface ResourcesSpec {
  memory: number;
  cores: number;
  coreFraction: number;
}

export interface ActionConfig {
  imageId: string;
  mode: string;
  githubToken: string;
  runnerHomeDir: string;
  label: string;
  subnetId: string;
  serviceAccountId: string;
  diskType: string;
  diskSize: number;
  folderId: string;
  zoneId: string;
  platformId: string;
  resourcesSpec: ResourcesSpec;

  instanceId?: string;
}

export interface GithubRepo {
  owner: string;
  repo: string;
}

export class Config {
  input: ActionConfig;
  githubContext: GithubRepo;

  constructor() {
    this.input = parseVmInputs();

    // the values of github.context.repo.owner and github.context.repo.repo are taken from
    // the environment variable GITHUB_REPOSITORY specified in "owner/repo" format and
    // provided by the GitHub Action on the runtime
    this.githubContext = {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    };

    //
    // validate input
    //

    if (!this.input.mode) {
      throw new Error(`The 'mode' input is not specified`);
    }

    if (!this.input.githubToken) {
      throw new Error(`The 'github-token' input is not specified`);
    }

    if (this.input.mode === 'start') {
      if (!this.input.imageId || !this.input.subnetId) {
        throw new Error(`Not all the required inputs are provided for the 'start' mode`);
      }
    } else if (this.input.mode === 'stop') {
      if (!this.input.label || !this.input.instanceId) {
        throw new Error(`Not all the required inputs are provided for the 'stop' mode`);
      }
    } else {
      throw new Error('Wrong mode. Allowed values: start, stop.');
    }
  }

  generateUniqueLabel(): string {
    return Math.random().toString(36).substr(2, 5);
  }
}

function parseVmInputs(): ActionConfig {
  core.startGroup('Parsing Action Inputs');

  const folderId: string = core.getInput('folder-id', {
    required: true,
  });

  const mode = core.getInput('mode');
  const githubToken = core.getInput('github-token');
  const runnerHomeDir = core.getInput('runner-home-dir');
  const label = core.getInput('label');

  const serviceAccountId: string = core.getInput('vm-service-account-id');

  const imageId: string = core.getInput('vm-image-id', {required: true});
  const zoneId: string = core.getInput('vm-zone-id') || 'ru-central1-a';
  const subnetId: string = core.getInput('vm-subnet-id', {required: true});
  const platformId: string = core.getInput('vm-platform-id') || 'standard-v3';
  const cores: number = parseInt(core.getInput('vm-cores') || '2', 10);
  const memory: number = parseMemory(core.getInput('vm-memory') || '1Gb');
  const diskType: string = core.getInput('vm-disk-type') || 'network-ssd';
  const diskSize: number = parseMemory(core.getInput('vm-disk-size') || '30Gb');
  const coreFraction: number = parseInt(core.getInput('vm-core-fraction') || '100', 10);

  const instanceId: string = core.getInput('instance-id', {required: false});

  core.endGroup();
  return {
    instanceId,
    imageId,
    diskType,
    diskSize,
    subnetId,
    zoneId,
    platformId,
    folderId,
    mode,
    githubToken,
    runnerHomeDir,
    label,
    serviceAccountId,
    resourcesSpec: {
      cores,
      memory,
      coreFraction,
    },
  };
}
