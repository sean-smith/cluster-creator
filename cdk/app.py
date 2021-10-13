#!/usr/bin/env python3
import os

from aws_cdk import core

from cluster_creator.cluster_creator_stack import ClusterCreator

app = core.App()
ClusterCreator(app, "ClusterCreator")

app.synth()
